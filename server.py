from datetime import datetime, timezone

from routers.commerce import router as commerce_router
api_router.include_router(commerce_router)
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Include the router in the main app last so every /api route is served.
app.include_router(api_router)
