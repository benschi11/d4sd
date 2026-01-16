# digi4school-downloader

## Features

- Download books and archives with folders and additional documents from https://digi4school.at/

  Supports linked books from:
  - Scook (https://www.scook.at/)
  - Westermann BiBox (https://bibox2.westermann.de/)
  - various others like https://hpthek.at/

- Download books from https://www.scook.at/ (only by url)
- Typescript API

## Installation

- Install [Node.js + npm](https://nodejs.org/)
- `npm i -g d4sd@latest`
  - (or use `yarn global add d4sd@latest`)
  - (or replace `d4sd` with `npx d4sd@latest` for all commands)

## Usage

Basic usage  
`d4sd -u <user> <...books>`

Specify a password and an output folder  
`d4sd -u <user> -p <password> -o ./download/ <...books>`

Download specific books using a glob pattern  
`d4sd -u john.doe@example.com -o ./download/ "Grundlagen d?? Elektrotechnik (2|3)*"`

Download your whole shelf  
`d4sd -u john.doe@example.com -o ./download/ "*"`

Download a book using an url  
`d4sd -u john.doe@example.com "https://digi4school.at/ebook/xxxxxxxxxxxx"` (`"another url"`...)

Download a book from Scook  
`d4sd -s scook -u john.doe@example.com "https://www.scook.at/produkt/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`

Download a book from Trauner DigiBox  
`d4sd -s trauner -u john.doe@example.com "Englisch *"`

More options can be found with `d4sd -h`.

**Note:** On Linux, make sure to use single quotes `'` instead of `"`.

### Slow internet connections

On slow networks I'd recommend setting the timeout to a higher value  
`d4sd -u <user> -t 180000 "*"`

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/garzj/d4sd.git
   cd d4sd
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

### Running Locally

#### Development Mode (with auto-reload)

Run the CLI in development mode with automatic reloading on file changes:

```bash
yarn dev -- -u <user> <...books>
# or
npm run dev -- -u <user> <...books>
```

Example:

```bash
yarn dev -- -u john.doe@example.com "*"
```

**Note:** The `--` separator is required to pass arguments to the CLI.

#### Production Mode

Build the project and run the compiled version:

```bash
# Build the project
yarn build
# or
npm run build

# Run the CLI
yarn start -- -u <user> <...books>
# or
npm start -- -u <user> <...books>
```

### Available Scripts

- `yarn typecheck` - Run TypeScript type checking without emitting files
- `yarn build` - Build both ESM and CommonJS versions
- `yarn build:esm` - Build ES modules version only
- `yarn build:cjs` - Build CommonJS version only
- `yarn start` - Run the compiled CLI from the built files
- `yarn dev` - Run in development mode with hot reload
- `yarn lint` - Check code formatting and run ESLint
- `yarn format` - Format code and fix ESLint issues

### Project Structure

- `src/` - TypeScript source code
  - `cli.ts` - CLI entry point
  - `config/` - Configuration files
  - `shelf/` - Shelf implementations (Digi4school, Scook, Trauner)
  - `item/` - Book and item handling
  - `util/` - Utility functions
- `esm/` - Compiled ES modules (generated)
- `cjs/` - Compiled CommonJS modules (generated)

## Disclaimer

This project is only for educational purposes. Don't download books with this tool please.
