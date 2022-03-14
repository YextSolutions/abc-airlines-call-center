# Dasha + Answers
Check out the demo below to see this project in action.

https://user-images.githubusercontent.com/72618502/158233017-f9a2c2af-4e8c-499e-ba6e-5d1fbe5e0110.mp4

# How to run this project

This app was created using the Dasha [blank-slate-app](https://github.com/dasha-samples/blank-slate-app) and the instructions to run this app are the same. 

1. Clone the repo and install the dependencies:

```sh
git clone https://github.com/apav-dev/abc-airlines-call-center
cd abc-airlines-call-center
npm install
```

2. Create or log into your account using the Dasha CLI tool:

```sh
npx dasha account login
```

3. To start a text chat, run:

```sh
npm start chat
```

4. To receive a phone call from Dasha, run:

```sh
npm start <your phone number>
```

The phone number should be in the international format without the `+` (e.g. `12223334455`)

# Copying the Yext account template
The account used in this demo uses the built-in FAQ entity type and custom Flight entity type. If you choose to copy the account used with this demo, be sure to remember to replace the API Key saved in ```index.js``` with your new API Key.

```bash
yext init 
yext resources apply account-template/
```
NOTE: use ```yext init -u sandbox``` if using a playground/sandbox account.

These commands require the Yext CLI, which you can install with:
```bash
brew install yext
```
