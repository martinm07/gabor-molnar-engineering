Install this in the VM manually- I don't wanna deal with the horrors of trying to run cron in a docker container (which is what kamal tries to do when specifying cron in config.yml). \
Simply do `crontab -e`, paste in the contents from the crontab file. \
Also create the files /root/dropbox-backup.sh (pasting in the contents of dropbox-backup.sh, and making sure to make it executable with chmod), \
and create /etc/dropbox-backup.env with the relevant environment variables. For reference it should look something like this:

```
DROPBOX_APP_KEY=abc123
DROPBOX_APP_SECRET=def456
DROPBOX_REFRESH_TOKEN=ghi789
MYSQL_ROOT_PASSWORD=jkliranoutofnumbers

MYSQL_CONTAINER=gabor-molnar-engineering-db
```

For the Dropbox keys that the script requires. Create a new Dropbox developer app. \
Make sure to give the app the file permissions it needs _before_ the next steps. \
Copy the "App key" for the app, and use it in opening the following URL in a browser; \
`https://www.dropbox.com/oauth2/authorize?client_id=<APP_KEY>&token_access_type=offline&response_type=code` \
This gives a short-lived authorization code, which you can use in a curl command:

```
  curl https://api.dropboxapi.com/oauth2/token \
    -d code=<CODE_FROM_BROWSER> \
    -d grant_type=authorization_code \
    -d client_id=<APP_KEY> \
    -d client_secret=<APP_SECRET>
```

(note it also needs the App secret from the Dropbox app developer console) \
This returns some JSON, something like this:

```
{
  "access_token": "sl.u.AGvfIQcjtQGtHVy-Jtv8DRdM[...]_SoEEtmh_QHI",
  "token_type": "bearer",
  "expires_in": 14400,
  "refresh_token": "0OBv5L8hybgAAAAAAAAAAe14tAqOhaSdbddrLRF8oiVMQTImFkw9fV8qbnhjK87y",
  "scope": "account_info.read files.content.read files.content.write files.metadata.read files.metadata.write",
  "uid": "2407174387",
  "account_id": "dbid:AACejk1Li2ZaKeFld4V7EIC7khoRcVFljgY"
}
```

Important here is the "refresh_token", which is what you should set DROPBOX_REFRESH_TOKEN to inside /etc/dropbox-backup.env. \
(this is apparently the only way to get a long-lived API token for Dropbox...)

This largely comes from Claude, who I asked to research the Dropbox API and create the `dropbox-backup.sh` script. \
https://claude.ai/share/1ab614b8-5ea5-42a7-b3b1-67f1e7379f5e
