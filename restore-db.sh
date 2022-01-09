#!/bin/bash
# To use this file:
# - Get the mongo database dump from Andrew
# - Start a demo server with `meteor --settings settings-example.json`
# - Run this script `./restore-db.sh path/to/dump`
# - Go to http://localhost:3000/viz/Day1 to see some data
mongorestore --host localhost:3001 --drop $@
