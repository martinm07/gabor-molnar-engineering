### WHEN UPDATING `requirements.txt` MAKE SURE TO REMOVE `mysqlclient` AND `pywin32` - THESE ARE ONLY FOR LOCAL (WINDOWS) DEVELOPMENT

### WHEN USING kamal MAKE SURE TO DO SO IN WSL (kamal tries running Bash commands that fail when running on Windows)

---

## `.kamal/secrets`

There needs to be a file called `.kamal/secrets`, containing secrets referenced by `config/deploy.yml`. These secrets are:

- `KAMAL_REGISTRY_PASSWORD`: A personal access token for my Docker account (username "themartinm07")
- `FLASK_SECRET_KEY`: Some secure secret key that can be used by Flask
- `MYSQL_ROOT_PASSWORD`: Some secure root password that can be used by MySQL
- `FLASK_SQLALCHEMY_DATABASE_URI`: The database connection string for the Flask server to use to connect to the MySQL server. This depends on `config/deploy.yml` and `config/init.sql` but should have the syntax `mysql+pymysql://root:<MYSQL_ROOT_PASSWORD>@<service-name>-<accessory-name>:<accessory-port (MySQL image default seems to be 3306)>/<database-name>`
- - `dialect+driver://username:password@host:port/database`
- - `pymysql` is the driver that SQLAlchemy will use to communicate with the database (also called the DBAPI- DataBase API). The default is `mysql-python` but this might've been creating problems with switching from Windows in development to Linux in production (specifically I believe it was the inclusion of `mysqlclient` in requirements.txt that caused problems), and so switching to the pure Python `pymysql` was part of the cure. I'm not sure if this is a necessary inclusion into the database URL, or what the problem really even was, but it's here now.
- - `<service-name>-<accessory-name>` is essentially a domain name for the internal Docker \[bridge\] network ([set up by Kamal](https://kamal-deploy.org/docs/upgrading/network-changes/)) that resolves into an internal IP address which allows containers to communicate with each other. Looking at `deploy.yml`, you could see for example that this should be "gabor-molnar-engineering-db". At first I tried to set this as the cloud host IP address but it seems like accessories don't communicate with the outside world even if you map their port to one on the host machine (as is done in configuring `port: "3306:3306"` for example). Perhaps that requires `proxy` to be set up.
- - `<accessory-port>`: I tried to see _how_ we know that the port we need to map is "3306" but couldn't find a way to configure the MySQL image. In general, passing parameters to `docker run` doesn't seem to be supported (even for the Typesense container where I expected to pass in `--enable-cors` and `--data-dir` and `--api-key` we just passed them in as environment variables, which luckily was also a supported way of configuring Typesense). Perhaps passing in the configuration file (currently commented out) is how to do it. Nonetheless, it seems like we can trust the port to be "3306".
- - `<database-name>`: There is passed in a MySQL initialization file however (located at `config/init.sql`) which creates the database that will be used. The name of that database is what needs to go here (e.g. "gab-mol-eng" from `CREATE DATABASE gab_mol_eng;`).
- `TYPESENSE_API_KEY`: Some secure secret key that can be used by Typesense
- `FLASK_TYPESENSE_API_KEY`: That same secret key that can be passed into the Flask application

---

## SSH Keys

Kamal needs an SSH \[private\] key that can be used to log into the host server. This of course requires configuring the host server to recognize the public key of that pair as a valid way of gaining access to the \[virtual\] machine. It is typically recommended to have only **one** public-private key pair per device, and on Linux machines this is stored as `~/.ssh/id_rsa.pub` and `~/.ssh/id_rsa` upon running `ssh-keygen` in Bash. This is the file (specifically the private key `~/.ssh/id_rsa`) that Kamal checks by default. If a key in a different location is required (for example on Windows) then that has to be specified in `config/deploy.yml` under `ssh.keys` which accepts a list of extra locations to check. `ssh.user` is also where to specify what user we're trying to log in as (by default it's `root`).

Note that when trying to use Windows files as private keys from a Linux environment (WSL), it will complain that the file's permissions are too open and fail, saying "It is required that your private key files are NOT accessible by others." To fix this a copy of the file needs to be made for Linux (e.g. using `cp /mnt/c/path/to/pk_file ~/.ssh/<pk-filename>`) so that the permissions can be modified (using `chmod 600 ~/.ssh/<pk-filename>`).

## User Permissions

The user we try to SSH into the host server as is important, and is linked to which user we associated the public key with on the server. Kamal will by default try to SSH in as the `root` user, but that can be changed using `ssh.user` under `config/deploy.yml`. If using a non-root user, there may not be the required permissions to bootstrap the server (installing docker, git, etc.) and has to be done manually from some console through the following:

```
sudo apt update
sudo apt upgrade -y
sudo apt install -y docker.io curl git
sudo usermod -a -G docker app
```

(_coming from [Kamal docs](https://kamal-deploy.org/docs/configuration/ssh/)_) \
If Kamal _is_ able to perform these commands, the user we SSH in as may still not have permissions to run `docker` commands without `sudo` because it is not in the "docker" user group. This can be fixed by logging into a bash console on the VM and running `sudo usermod -aG docker $USER`.
