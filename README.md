---
## NEW README
This repo is originall designed for migrating Dashboard 1.0 data from OpenLDAP into MongoDB of 2.0. So is the derivation of the name of this repo. However it also includes other scripts that helps you work on Dashboard.

To use this, first you need to clone it under dashboard's folder. Check the 'Clone and Install' sector of old WalkThrough below.

## Tools
`add-admin.js`, Adding users into admin(or other) groups programmatically.

---

## OLD README
These're simple scripts, I have only impemented converting via stdin/stdout.

After you have Dashboard 2.0 installed, you may begin to migrate the data.

# WalkThrough
Suppose you have Dashboard 2.0 installed under `path`, then

#### Clone and Install

First ensure you have `node` specified, by this

    nvm use [same version as the dashboard]

Then,

    cd path/app
    git clone https://github.com/Plypy/OpenMRS-ID-Migrator.git Migrator

    cd Migrator
    npm install


#### Get Data From OpenLDAP
Get user

    ldapsearch -x -W -LLL -D cn=admin,dc=openmrs,dc=org -b ou=users,dc=openmrs,dc=org uid=* > users.ldif

Get groups

    ldapsearch -x -W -LLL -D cn=admin,dc=openmrs,dc=org -b ou=groups,dc=openmrs,dc=org cn=* > groups.ldif

#### Parse Data

    node parse-users.js < users.ldif > users.json
    node parse-groups.js < groups.ldif > groups.json

#### Migrate Data

    node store.js

If successful, you should see this, by now.
~~~
successfully synced all groups
successfully synced all users
~~~

Congratulations, you've successfully migrated to Dashboard 2.0! 

Then you'd better delete this.

    cd ..
    rm -rf Migrator

#### Verify the Migration

To verify whether the data was correctly migrated to mongo, run this command,

    node verify.js

Ignore the log message coming from ldap. If everything was alright, you shall see `All data was successfully and correctly migrated`.

And if something was wrong, I hope not, the verifier will report.

# Strategy to Erase Duplicate Emails

For some reasons, there are some old accounts with duplicate emails. And this shouldn't and won't be allowed to happen in the Dashboard 2.0.

So based on this [talk](https://talk.openmrs.org/t/migration-accounts-with-the-same-email-address/407), I've adopted such strategy.

For duplicate emails,

+ Remove all nonprimary emails.
+ Users with duplicate primary email will be skipped.
+ Removed emails and skipped users will be stored in 'skipped.json', if there is any.

Except from those, all info will be migrated into mongo.

That's all.
