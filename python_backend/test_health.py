from app import app, init_model


def main():
    # Initialize model so health reports OK
    init_model()

    with app.test_client() as client:
        health_resp = client.get('/health')
        print('Health status code:', health_resp.status_code)
        try:
            print('Health JSON:', health_resp.get_json())
        except Exception:
            print('Health response text:', health_resp.data.decode('utf-8', errors='ignore'))

        chat_resp = client.post('/chat', json={'message': 'Hello there'})
        print('Chat status code:', chat_resp.status_code)
        try:
            print('Chat JSON:', chat_resp.get_json())
        except Exception:
            print('Chat response text:', chat_resp.data.decode('utf-8', errors='ignore'))


if __name__ == '__main__':
    main()