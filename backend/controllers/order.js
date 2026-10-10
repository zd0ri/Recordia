const Order = require('../models/order');
const Product = require('../models/product');
const catchAsync = require('../utils/catchAsync')
const sendEmail = require('../utils/sendEmail');
const generateReceipt = require('../utils/generateReceipt');
const createOrderEmail = require('../utils/orderEmail');



// Create a new order   =>  /api/v1/order/new
exports.newOrder = catchAsync(async (req, res, next) => {
    const { orderItems, shippingInfo, paymentInfo } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one order item is required'
        });
    }

    if (!shippingInfo || !paymentInfo?.method) {
        return res.status(400).json({
            success: false,
            message: 'Shipping information and payment method are required'
        });
    }

    if (!['GCash', 'COD'].includes(paymentInfo.method)) {
        return res.status(400).json({
            success: false,
            message: 'Payment method must be GCash or COD'
        });
    }

    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const normalizedItems = [];

    for (const item of orderItems) {
        const product = productMap.get(String(item.product));
        const quantity = Number(item.quantity);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found: ${item.product}`
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: `Invalid quantity for ${product.album_title}`
            });
        }

        if (product.stocks < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${product.album_title}`
            });
        }

        normalizedItems.push({
            product: product._id,
            name: product.album_title,
            quantity,
            image: product.images[0]?.url || 'https://placehold.co/100x100?text=Recordia',
            price: product.price
        });
    }

    const itemsPrice = normalizedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const taxPrice = Number((itemsPrice * 0.12).toFixed(2));
    const shippingPrice = 0;
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

    const order = await Order.create({
        orderItems: normalizedItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo: { method: paymentInfo.method, status: 'Pending' },
        orderStatus: 'Pending',
        stockDeducted: false,
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })
})

exports.myOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        orders
    })
})

exports.getSingleOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID',
        });
    }
    const isOwner = order.user
        && order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'You are not allowed to view this order'
        });
    }

    res.status(200).json({
        success: true,
        order
    })
})

exports.allOrders = catchAsync(async (req, res, next) => {
    const validStatuses = ['Pending', 'Cancelled', 'Processing', 'Shipped', 'Completed'];
    const filter = {};
    if (req.query.status) {
        if (!validStatuses.includes(req.query.status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }
        filter.orderStatus = req.query.status;
    }

    const orders = await Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
    const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

exports.deleteOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })

    }
    return res.status(200).json({
        success: true
    })
})

exports.updateOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'No Order found with this ID' });
    }
    const validStatuses = ['Pending', 'Cancelled', 'Processing', 'Shipped', 'Completed'];
    const nextStatus = req.body.status;

    if (!validStatuses.includes(nextStatus)) {
        return res.status(400).json({ message: 'Invalid order status' });
    }
    if (order.orderStatus === 'Completed' || order.orderStatus === 'Cancelled') {
        return res.status(400).json({
            message: `Orders with status ${order.orderStatus} cannot be changed`
        });
    }

    if (nextStatus === 'Processing' && !order.stockDeducted) {
        const products = await Product.find({
            _id: { $in: order.orderItems.map((item) => item.product) }
        });
        const productMap = new Map(products.map((product) => [product._id.toString(), product]));

        for (const item of order.orderItems) {
            const product = productMap.get(item.product.toString());
            if (!product || product.stocks < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${item.name}`
                });
            }
        }
        for (const item of order.orderItems) {
            await updateStock(item.product, -item.quantity);
        }
        order.stockDeducted = true;
    }

    if (nextStatus === 'Cancelled' && order.stockDeducted) {
        for (const item of order.orderItems) {
            await updateStock(item.product, item.quantity);
        }
        order.stockDeducted = false;
    }

    order.orderStatus = nextStatus;
    if (nextStatus === 'Completed') {
        order.deliveredAt = Date.now();
    }
    await order.save();

    let emailWarning;
    const orderForEmail = await Order.findById(order._id)
        .populate('user', 'name email');
    try {
        const receipt = await generateReceipt(orderForEmail);
        await sendEmail({
            email: orderForEmail.user.email,
            subject: `Recordia order ${orderForEmail._id} updated`,
            html: createOrderEmail(orderForEmail),
            attachments: [{
                filename: `recordia-order-${orderForEmail._id}.pdf`,
                content: receipt,
                contentType: 'application/pdf'
            }]
        });
    } catch (error) {
        emailWarning = 'Order updated, but the customer email could not be sent';
        console.error('Order status email failed:', error.message);
    }

    res.status(200).json({
        success: true,
        order: orderForEmail,
        ...(emailWarning ? { warning: emailWarning } : {})
    })
})

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (!product) {
        throw new Error(`Product not found: ${id}`);
    }
    product.stocks += quantity;
    await product.save({ validateBeforeSave: false });
}

exports.totalOrders = catchAsync(async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

})

exports.totalSales = catchAsync(async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
})

exports.customerSales = catchAsync(async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },
        // {
        //     $group: {
        //         _id: "$user",
        //         total: { $sum: "$totalPrice" },
        //     }
        // },

        { $unwind: "$userDetails" },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        // {
        //     $group: {
        //         _id: "$userDetails.name",
        //         total: { $sum: "$totalPrice" }
        //     }
        // },
        {
            $project: {
                _id: 0,
                "userDetails.name": 1,
                total: 1,
            }
        },
        { $sort: { total: -1 } },

    ])
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    res.status(200).json({
        success: true,
        customerSales
    })

})

exports.salesPerMonth = catchAsync(async (req, res, next) => {
    const year = Number(req.query.year);
    const selectedYear = Number.isInteger(year) && year >= 1970 ? year : new Date().getFullYear();
    const start = req.query.startDate
        ? new Date(`${req.query.startDate}T00:00:00.000Z`)
        : new Date(Date.UTC(selectedYear, 0, 1));
    const end = req.query.endDate
        ? new Date(`${req.query.endDate}T00:00:00.000Z`)
        : new Date(Date.UTC(selectedYear + 1, 0, 1));
    if (req.query.endDate) {
        end.setUTCDate(end.getUTCDate() + 1);
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({
            success: false,
            message: 'Invalid sales date range'
        });
    }

    const groupedSales = await Order.aggregate([
        {
            $match: {
                orderStatus: 'Completed',
                createdAt: { $gte: start, $lt: end }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                sales: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groupedByMonth = new Map(
        groupedSales.map((item) => [`${item._id.year}-${item._id.month}`, item])
    );
    const hasDateRange = Boolean(req.query.startDate || req.query.endDate);
    const months = monthLabels.map((label, index) => {
        const month = index + 1;
        const item = hasDateRange
            ? groupedSales
                .filter((entry) => entry._id.month === month)
                .reduce(
                    (result, entry) => ({
                        sales: result.sales + entry.sales,
                        orders: result.orders + entry.orders
                    }),
                    { sales: 0, orders: 0 }
                )
            : groupedByMonth.get(`${selectedYear}-${month}`);
        return {
            month: label,
            sales: item?.sales || 0,
            orders: item?.orders || 0
        };
    });
    const totals = groupedSales.reduce(
        (result, item) => ({
            sales: result.sales + item.sales,
            orders: result.orders + item.orders
        }),
        { sales: 0, orders: 0 }
    );

    res.status(200).json({
        success: true,
        year: selectedYear,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        months,
        totalSales: totals.sales,
        orderCount: totals.orders
    })

})