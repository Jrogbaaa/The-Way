import modal

app = modal.App("hello-world")

@app.function()
def hello():
    return "Hello, Modal is working!"

@app.local_entrypoint()
def main():
    message = hello.remote()
    print(message) 