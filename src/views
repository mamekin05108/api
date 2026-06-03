# testapp/views.py
import json
import os
import traceback
import requests
import openpyxl  # ★ Excel操作用のライブラリを追加
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from .serializers import CustomerQuerySerializer
from django.http import FileResponse, Http404


def index_view(request):
    return render(request, "Hensai/query_form.html")


# ==========================================
# ★ Excel転記用の便利なヘルパー関数群
# ==========================================


def dig(data, *keys, default=""):
    """
    複雑な階層のJSONから安全に値を取り出す関数（KeyError防止）
    """
    for key in keys:
        if isinstance(data, dict):
            data = data.get(key)
        elif isinstance(data, list) and isinstance(key, int):
            try:
                data = data[key]
            except IndexError:
                return default
        else:
            return default
    return data if data is not None else default


def generate_excel_report(shop_id, customer_id, response_json, timestamp):
    """
    レスポンスJSONの内容をExcelひな形に転記して保存する関数
    """
    # 1. ひな形（テンプレート）のパス設定
    template_path = "templates/Hensai/report_template.xlsx"

    # ひな形が存在しない場合の開発用フォールバック
    if not os.path.exists(template_path):
        # テンプレートがない場合は新規に空のワークブックを作成して動作を継続します
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "返済帳票"
    else:
        wb = openpyxl.load_workbook(template_path)
        ws = wb.active

    # 2. 基本情報の書き込み
    # セル B2 に店番と顧客番号
    ws["B2"] = f"店番: {shop_id} / 顧客番号: {customer_id}"

    # セル B3 に、レスポンスから抽出した顧客名（ネストを想定）
    # 例: response_json['customer_profile']['name'] から取り出す場合を想定
    customer_name = dig(response_json, "customer_profile", "name", default="鈴木 太郎")
    ws["B3"] = f"{customer_name} 様"

    # 3. 動的項目の「上詰め」書き込み処理の例
    # レスポンスに車やバイクの情報（例: response_json['vehicles']['car'] 等）が含まれると仮定
    car_brand = dig(response_json, "vehicles", "car", default="")
    bike_brand = dig(response_json, "vehicles", "bike", default="")

    items_to_write = [
        ("車", car_brand),
        ("バイク", bike_brand),
    ]

    # B5セルから上詰めで書き込み開始
    current_row = 5
    for label, value in items_to_write:
        if value:  # 値がある場合のみ
            # 必要に応じて下にある項目を保護するために行を挿入
            if current_row > 5:
                ws.insert_rows(current_row)

            ws[f"B{current_row}"] = label
            ws[f"C{current_row}"] = value
            current_row += 1

    # 4. Excelファイルを保存する
    save_dir = "saved_excel_reports"
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    excel_filename = f"{save_dir}/report_{shop_id}_{customer_id}_{timestamp}.xlsx"
    wb.save(excel_filename)

    return excel_filename


# ==========================================
# ビュークラスの定義
# ==========================================


class ExternalApiProxyView(APIView):
    """
    画面から店番、顧客番号、処理モードを受信し、
    宛先・リクエスト・レスポンスをまとめてタイムスタンプ付きでJSON保存、
    さらに返ってきたレスポンスをExcelに転記するView
    """

    def post(self, request, *args, **kwargs):
        try:
            # 1. 画面からの入力をSerializerでバリデーション
            serializer = CustomerQuerySerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"error": "入力チェックエラー", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            validated_data = serializer.validated_data
            shop_id = validated_data.get("shop_id")
            customer_id = validated_data.get("customer_id")
            action_type = validated_data.get("action_type", "none")

            # 2. 外部サーバー送信用にリクエストJSONを構築
            external_request_payload = {
                "store_code": shop_id,
                "customer_number": customer_id,
                "source_system": "DRF-Proxy-Gateway",
            }

            # 3. 保存用データのひな形を準備
            save_payload = {
                "action_type": action_type,
                "destination_url": "なし（保存のみ）",
                "request": external_request_payload,
                "response": None,
                "status_code": None,
            }

            # 保存先ディレクトリの準備
            save_dir = "saved_requests"
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)

            # 現在日時のタイムスタンプを生成
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # ファイル名の定義
            filename = f"{save_dir}/request_response_{action_type}_{shop_id}_{customer_id}_{timestamp}.json"

            # 4. 「③ 発信しないで保存のみ」の場合の処理
            if action_type == "none":
                # ファイルへ書き込み
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(save_payload, f, ensure_ascii=False, indent=4)

                return Response(
                    {
                        "message": "リクエストJSONの作成と保存が完了しました（外部発信はしていません）。",
                        "saved_to": filename,
                        "created_payload": external_request_payload,
                    },
                    status=status.HTTP_200_OK,
                )

            # 「① A先」または「② B先」のURLを設定
            if action_type == "A":
                external_api_url = (
                    "https://api.external-service-a.com/v1/customer-lookup"
                )
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer SECRET_KEY_FOR_A",
                }
            elif action_type == "B":
                external_api_url = (
                    "https://api.external-service-b.com/v1/customer-lookup"
                )
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer SECRET_KEY_FOR_B",
                }
            else:
                return Response(
                    {"error": "無効な送信先が指定されました。"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 保存用データに宛先URLを記録
            save_payload["destination_url"] = external_api_url

            # 5. 外部サーバーへリクエスト送信
            try:
                response = requests.post(
                    external_api_url,
                    json=external_request_payload,
                    headers=headers,
                    timeout=5.0,
                )

                # レスポンスのJSONデータをパースして、保存用データに記録
                try:
                    response_json = response.json()
                    save_payload["response"] = response_json
                except ValueError:
                    response_json = {"raw_text": response.text}
                    save_payload["response"] = response_json

                save_payload["status_code"] = response.status_code

                # ★【追加】受け取ったレスポンスJSONデータをExcelに転記する
                excel_file_path = generate_excel_report(
                    shop_id=shop_id,
                    customer_id=customer_id,
                    response_json=response_json,
                    timestamp=timestamp,
                )

                # レスポンスを含めた最終結果をJSONとしてローカルに保存
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(save_payload, f, ensure_ascii=False, indent=4)

                # 画面へレスポンスを返す（保存されたExcelファイルのパスを含めます）
                return Response(
                    {
                        "message": f"外部連携および結果の保存が完了しました（送信先: {action_type}先）",
                        "status_code": response.status_code,
                        "saved_to": filename,
                        "saved_excel_to": excel_file_path,  # ★ 画面側でダウンロードできるようにパスを返却
                        "external_data": response_json,
                    },
                    status=status.HTTP_200_OK if response.ok else response.status_code,
                )

            except requests.exceptions.Timeout as e:
                save_payload["response"] = {"error": "Timeout", "details": str(e)}
                save_payload["status_code"] = 504
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(save_payload, f, ensure_ascii=False, indent=4)

                return Response(
                    {
                        "error": f"外部サーバー({action_type}先)へのリクエストがタイムアウトしました。"
                    },
                    status=status.HTTP_504_GATEWAY_TIMEOUT,
                )
            except requests.exceptions.RequestException as e:
                save_payload["response"] = {
                    "error": "RequestException",
                    "details": str(e),
                }
                save_payload["status_code"] = 502
                with open(filename, "w", encoding="utf-8") as f:
                    json.dump(save_payload, f, ensure_ascii=False, indent=4)

                return Response(
                    {
                        "error": f"外部サーバー({action_type}先)との通信に失敗しました。",
                        "details": str(e),
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        except Exception as e:
            error_message = str(e)
            stack_trace = traceback.format_exc()
            return Response(
                {
                    "error": "Pythonコード実行中にエラーが発生しました（500）",
                    "exception_type": type(e).__name__,
                    "message": error_message,
                    "traceback": stack_trace,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================
# ファイルダウンロード用ビュー
# ==========================================


def download_excel_view(request):
    """
    作成されたExcelファイルをブラウザ経由で安全にダウンロードさせるビュー
    """
    file_path = request.GET.get("path")

    # セキュリティチェック: 指定されたパスが「saved_excel_reports/」から始まっているか検証
    if not file_path or not file_path.startswith("saved_excel_reports/"):
        raise Http404("不正なファイルアクセスです。")

    if os.path.exists(file_path):
        # ファイル応答としてExcelファイルを返却
        response = FileResponse(
            open(file_path, "rb"),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        # ファイル名を指定してダウンロードを強制
        response["Content-Disposition"] = (
            f'attachment; filename="{os.path.basename(file_path)}"'
        )
        return response
    else:
        raise Http404("指定されたExcelファイルが存在しません。")
