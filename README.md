# SORUS Server Application

### To avoid installation, you may use the live demo instance by clicking [here for the Dashboard](https://sorus-dashboard.web.app) or clicking [here for the Mobile PWA](https://staging-sorus.odellobrien.com).

### Required software:

1. NodeJS (version 13 and above)
2. MySQL Server
3. Knex CLI (`npm install -g knex`)

### How to run:

1. Clone this repository
2. Create an empty database for the system database (Use phpMyAdmin or other tools)
3. Copy file `knexfile.bak.js` to `knexfile.js` and edit the configuration to match your MySQL database connection info and database name.
4. Once the `knexfile.js` had been configured, open Command Prompt and `cd` to the root of the project directory (The same folder with the `knexfile.js` file)
5. Run `knex migrate:latest`
6. Once the migration script had completed, run `node index.js` to start the server.