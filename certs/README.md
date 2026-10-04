Drop your corporate root CA here (PEM) if the network does SSL inspection, then build with:

    docker compose build --build-arg EXTRA_CA_CERT=certs/corp-root-ca.crt

Do not commit real certificates if your policy forbids it — they are git-ignored by default.
