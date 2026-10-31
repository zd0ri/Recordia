import Swal from 'sweetalert2';

export const showCrudSuccess = (action) => Swal.fire({
  icon: 'success',
  title: `${action} successfully`,
  timer: 1600,
  showConfirmButton: false,
});

export const confirmCrudDelete = (label) => Swal.fire({
  icon: 'warning',
  title: `Delete ${label}?`,
  text: 'This action cannot be undone.',
  showCancelButton: true,
  confirmButtonColor: '#b42318',
  confirmButtonText: 'Delete',
});
