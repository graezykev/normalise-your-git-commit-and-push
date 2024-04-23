# Normalise Your Git Commit and Push Processes

**Using `husky`, `eslint`, `lint-stage`, `commitlint` and straightforward Shell scripts.**

See the [Steps](./steps.md)

## Try It Out

```sh
npm install
```

Edit `index.js` whatever you like or:

```sh
echo "var ccc" >> index.js
```

Commit it:

```sh
git commit -am 'test commit'
```

If it fails, force the commit:

```sh
git commit -am 'test commit' --no-verify
```

Try the push:

```sh
git push origin main
```
