<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/060a76e9-f160-4afb-8c9f-63fd2bb74772

## Run Locally

**Prerequisites:**  Node.js

<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>顧客クエリ テスト画面</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; background-color: #f9f9f9; }
        .container { max-width: 600px; background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { padding: 8px; width: 95%; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        pre { background: #333; color: #fff; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 14px; }
        .result-section { margin-top: 25px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>顧客クエリ テスト画面</h2>
        <p>店番と顧客番号を入力して「JSON作成・保存」を押してください。</p>
        
        <form id="queryForm">
            <div class="form-group">
                <label for="shopId">店番 (shop_id):</label>
                <input type="text" id="shopId" name="shop_id" required value="123">
            </div>
            <div class="form-group">
                <label for="customerId">顧客番号 (customer_id):</label>
                <input type="text" id="customerId" name="customer_id" required value="987654">
            </div>
            <button type="submit">JSON作成・保存</button>
        </form>

        <div class="result-section">
            <h3>処理結果・生成されたJSON</h3>
            <pre id="result">フォームを送信すると、ここに結果が表示されます。</pre>
        </div>
    </div>

    <script>
        document.getElementById('queryForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const shopId = document.getElementById('shopId').value;
            const customerId = document.getElementById('customerId').value;
            const resultElement = document.getElementById('result');
            
            resultElement.textContent = "処理中...";

            try {
                // APIエンドポイントへ送信
                const response = await fetch('/api/external-proxy/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken') // DjangoのCSRF対策
                    },
                    body: JSON.stringify({
                        shop_id: shopId,
                        customer_id: customerId
                    })
                });

                const data = await response.json();
                // 結果のJSONをインデント付きテキストに変換して表示
                resultElement.textContent = JSON.stringify(data, null, 4);
            } catch (error) {
                resultElement.textContent = "エラーが発生しました: " + error;
            }
        });

        // DjangoのCSRFトークンをCookieから取得する関数
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    </script>
</body>
</html>