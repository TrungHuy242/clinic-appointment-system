from rest_framework.response import Response


def ok(data=None, status_code=200):
    """Thin success wrapper to keep response creation consistent."""
    return Response(data or {}, status=status_code)


def created(data=None):
    return ok(data=data, status_code=201)


def no_content():
    return Response(status=204)
