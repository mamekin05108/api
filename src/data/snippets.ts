/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DRF_SERIALIZER_CODE = `# serializers.py
from rest_framework import serializers

class CustomerQuerySerializer(serializers.Serializer):
    # 店番（数字4桁など、要件に合わせてバリデーションを追加可能）
    shop_id = serializers.CharField(
        max_length=10, 
        required=True, 
        error_messages={"required": "店番は必須入力です。"}
    )
    # 顧客番号（例: 5桁〜10桁の半角英数字など）
    customer_id = serializers.CharField(
        max_length=20, 
        required=True, 
        error_messages={"required": "顧客番号は必須入力です。"}
    )
`;

export const DRF_VIEW_CODE = `# views.py
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .serializers import CustomerQuerySerializer

class ExternalApiProxyView(APIView):
    """
    画面（React等）から店番、顧客番号を受信し、
    外部APIにリクエストJSONをPOSTして、レスポンスを返すView
    """
    
    def post(self, request, *args, **kwargs):
        # 1. 画面(React等)からの入力をSerializerでバリデーション
        serializer = CustomerQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "入力チェックエラー", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # バリデーション済みのデータを取り出す
        validated_data = serializer.validated_data
        shop_id = validated_data.get("shop_id")
        customer_id = validated_data.get("customer_id")
        
        # 2. 外部サーバー送信用にリクエストJSONを構築
        # (必要に応じて、外部サーバーのキー名にマッピングします)
        external_request_payload = {
            "store_code": shop_id,
            "customer_number": customer_id,
            "source_system": "DRF-Proxy-Gateway",
            # 必要に応じて追加パラメータや認証情報を設定
        }
        
        # 3. 外部の秘密サーバーなどへHTTP POST送信
        external_api_url = "https://api.external-service.com/v1/customer-lookup"
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_SECRET_API_KEY" # 暗号化キー等
        }
        
        try:
            # 外部サーバーへ実際にリクエストをPost (タイムアウトを5秒に設定)
            response = requests.post(
                external_api_url, 
                json=external_request_payload, 
                headers=headers,
                timeout=5.0
            )
            
            # レスポンスのJSONデータをパース
            response_json = response.json()
            
            # 4. レスポンスJSONをReact等の画面へそのまま（あるいは整形して）返却する
            return Response(
                {
                    "message": "外部連携が完了しました",
                    "status_code": response.status_code,
                    "external_data": response_json
                },
                status=status.HTTP_200_OK if response.ok else response.status_code
            )
            
        except requests.exceptions.Timeout:
            # タイムアウトエラーハンドリング
            return Response(
                {"error": "外部サーバーへのリクエストがタイムアウトしました。"},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.RequestException as e:
            # 接続エラーやその他のHTTPエラーハンドリング
            return Response(
                {
                    "error": "外部サーバーとの通信に失敗しました。",
                    "details": str(e)
                },
                status=status.HTTP_502_BAD_GATEWAY
            )
        except ValueError:
            # JSONデコードエラー
            return Response(
                {
                    "error": "外部サーバーから無効なレスポンスが返されました。",
                    "raw_response": response.text
                },
                status=status.HTTP_502_BAD_GATEWAY
            )
`;

export const DRF_URLS_CODE = `# urls.py
from django.urls import path
from .views import ExternalApiProxyView

urlpatterns = [
    # 外部通信プロキシのエンドポイント
    path('api/external/customer-lookup/', ExternalApiProxyView.as_view(), name='customer-lookup-proxy'),
]
`;

export const REACT_CODE = `// CustomerQueryForm.jsx
import React, { useState } from 'react';

export default function CustomerQueryForm() {
  // 入力フォームの状態管理
  const [shopId, setShopId] = useState('');
  const [customerId, setCustomerId] = useState('');
  
  // 読み込み状態・エラー・レスポンス結果の状態管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [responseResult, setResponseResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 状態のクリア
    setLoading(true);
    setError(null);
    setResponseResult(null);

    // 送信用のリクエストJSON作成
    const payload = {
      shop_id: shopId,
      customer_id: customerId
    };

    try {
      // Django REST Frameworkのプロキシエンドポイントを呼び出す
      const response = await fetch('/api/external/customer-lookup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 必要に応じてCSRFトークンヘッダーを追加
          // 'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'リクエストに失敗しました');
      }

      // レスポンスデータを状態に保存
      setResponseResult(data);

    } catch (err) {
      console.error(err);
      setError(err.message || '通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>店番・顧客情報 照会フォーム</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>店番:</label>
          <input 
            type="text" 
            value={shopId} 
            onChange={(e) => setShopId(e.target.value)} 
            placeholder="例: 1001" 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>顧客番号:</label>
          <input 
            type="text" 
            value={customerId} 
            onChange={(e) => setCustomerId(e.target.value)} 
            placeholder="例: C-98765" 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? '照会中...' : '外部APIへ送信'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#ffe3e3', color: '#d32f2f', borderRadius: '4px' }}>
          <strong>エラー:</strong> {error}
        </div>
      )}

      {responseResult && (
        <div style={{ marginTop: '16px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
          <strong>連携結果:</strong>
          <pre style={{ margin: '8px 0 0 0', padding: '8px', backgroundColor: '#f8fafc', overflowX: 'auto', fontSize: '13px' }}>
            {JSON.stringify(responseResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
`;
