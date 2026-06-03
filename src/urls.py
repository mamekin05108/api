# urls.py
from django.urls import path
from .views import ExternalApiProxyView

urlpatterns = [
    # 外部通信プロキシのエンドポイント
    path('api/external/customer-lookup/', ExternalApiProxyView.as_view(), name='customer-lookup-proxy'),
]
