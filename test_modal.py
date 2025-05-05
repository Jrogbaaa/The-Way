import modal

app = modal.App("test-app")

@app.function()
def hello(name):
    print(f"Hello, {name}!")
    return f"Hello, {name}!"

if __name__ == "__main__":
    with app.run():
        result = hello.remote("Modal")
        print(f"Result from remote function: {result}") 