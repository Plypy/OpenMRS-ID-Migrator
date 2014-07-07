These're simple scripts, I have only impemented converting via stdin/stdout.

After you have Dashboard 2.0 installed, you may begin to migrate the data.

# WalkThrough
Suppose you have Dashboard 2.0 installed under `path`, then

#### Clone and Install

First ensure you have `node` specified, by this

    nvm use 0.8

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

Parse user

    node parse-users.js < users.ldif > users.json
    node parse-groups.js < groups.ldif > groups.json

#### Migrate Data

    node --harmony store.js

If successful, you should see this, by now.
~~~
successfully synced all groups
successfully synced all users
~~~

Congratulations, you've successfully migrated to Dashboard 2.0! 

Then you'd better delete this.

    cd ..
    rm -rf Migrator

That's all.
