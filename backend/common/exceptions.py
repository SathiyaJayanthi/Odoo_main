from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'error': {
                'code': str(response.status_code),
                'message': _get_error_message(response),
            }
        }
        # Include field-level errors if present
        if isinstance(response.data, dict) and len(response.data) == 1:
            key = next(iter(response.data))
            if key not in ('detail', 'non_field_errors') and isinstance(response.data[key], list):
                error_data['error']['field'] = key
                error_data['error']['message'] = response.data[key][0]
        elif isinstance(response.data, dict) and 'detail' in response.data:
            error_data['error']['message'] = str(response.data['detail'])
        elif isinstance(response.data, list):
            error_data['error']['message'] = str(response.data[0]) if response.data else 'An error occurred'

        return Response(error_data, status=response.status_code)

    # Unhandled exceptions (500s)
    return Response(
        {'error': {'code': '500', 'message': 'An internal server error occurred.'}},
        status=500,
    )


def _get_error_message(response):
    if isinstance(response.data, dict):
        if 'detail' in response.data:
            return str(response.data['detail'])
        # Flatten first field error
        for key, value in response.data.items():
            if isinstance(value, list) and value:
                return str(value[0])
    elif isinstance(response.data, list) and response.data:
        return str(response.data[0])
    return 'An error occurred'
