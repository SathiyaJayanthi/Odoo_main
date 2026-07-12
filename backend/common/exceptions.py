from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, AuthenticationFailed, NotAuthenticated, PermissionDenied

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If the exception is not handled by DRF (returns None),
    # let it bubble up as a genuine 500.
    if response is None:
        return None

    # Reshape the response into our custom schema
    if isinstance(exc, ValidationError):
        # Extract first error message and field name
        first_field = None
        first_message = 'Validation error occurred.'
        if isinstance(response.data, dict):
            for key, value in response.data.items():
                if key != 'non_field_errors':
                    first_field = key
                if isinstance(value, list) and len(value) > 0:
                    first_message = str(value[0])
                else:
                    first_message = str(value)
                break
        elif isinstance(response.data, list) and len(response.data) > 0:
            first_message = str(response.data[0])

        error_data = {
            'error': {
                'code': 'validation_error',
                'message': first_message,
                'field': first_field
            }
        }
        return Response(error_data, status=400)

    elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        message = response.data.get('detail', 'Authentication failed.') if isinstance(response.data, dict) else 'Authentication failed.'
        error_data = {
            'error': {
                'code': 'authentication_failed',
                'message': str(message)
            }
        }
        return Response(error_data, status=401)

    elif isinstance(exc, PermissionDenied):
        message = response.data.get('detail', 'Permission denied.') if isinstance(response.data, dict) else 'Permission denied.'
        error_data = {
            'error': {
                'code': 'permission_denied',
                'message': str(message)
            }
        }
        return Response(error_data, status=403)

    # If it's some other APIException (e.g., our custom ones), format if needed
    # but the instructions say "custom business-logic exceptions return the correct shape",
    # so we can just return response data if it already has 'error',
    # or wrap it if it doesn't.
    if isinstance(response.data, dict) and 'error' in response.data:
        return response

    # Fallback shape for other DRF exceptions (like MethodNotAllowed)
    message = response.data.get('detail', 'An error occurred.') if isinstance(response.data, dict) else 'An error occurred.'
    return Response({
        'error': {
            'code': str(response.status_code),
            'message': str(message)
        }
    }, status=response.status_code)
