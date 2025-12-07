from rest_framework.permissions import BasePermission

class FeedbackPermission(BasePermission):
    def has_permission(self, request):
        if request.method == 'GET':
            return True
        return request.user.is_authenticated
       