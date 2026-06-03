# serializers.py
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
