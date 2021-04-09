# Instant Sport Session Tracker API

> A CLI to create a Sport session tracker API

## Why ?

The aim of this package is to provide an API for front-end exercices, allowing student to use an API without having to setup one themself.

## Who made this

Hi ! I'm Etienne, you can [follow me on Twitter](https://twitter.com/Etienne_dot_js) 😉

## Usage

```bash
npx @instant-api/sport-session-tracker
```

Once the server is up, open the url in the browser to get the list of routes !

## Options

- `--help` or `-h`: Show the content of the readme file
- `--port` or `-p`: The port to use
- `--folder` or `-f`: The path to the folder used to store data.
- `--slow` or `-s`: Add a random delay to every request to simulate a real network

**Note**: By default the `folder` is set to `sport-session-tracker`.

```bash
npx @instant-api/sport-session-tracker --port 9000 --folder sport-session-api
```

If you provide an argument with no name is will be used as the `folder` argument

```bash
npx @instant-api/sport-session-tracker sport-session-api
```
