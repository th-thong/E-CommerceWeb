from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Quyền tùy chỉnh: Chỉ cho phép chủ sở hữu của một đối tượng
    được phép truy cập và chỉnh sửa nó.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Phương thức này được gọi khi truy cập một đối tượng cụ thể.
        'obj' ở đây chính là instance của Shop.
        """
        return obj.owner == request.user