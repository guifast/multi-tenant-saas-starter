# API Notes

The API returns JSON envelopes:

```json
{
  "data": {}
}
```

List endpoints may include:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

## Browser Security

For authenticated mutations, send:

```txt
x-csrf-token: <csrf cookie value>
```

The web app helper in `apps/web/lib/api.ts` reads this cookie and attaches the header automatically.

## Errors

Domain failures return an error code and message:

```json
{
  "code": "PROJECT_NOT_FOUND",
  "message": "Project not found.",
  "requestId": "..."
}
```

## Local Swagger

Run the API and open:

```txt
http://localhost:4000/docs
```
