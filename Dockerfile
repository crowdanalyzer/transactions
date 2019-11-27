FROM node:12.4.0

RUN printf '#!/bin/bash \n\
set -e \n\
if [ -d /home/node/deps/node_modules ]; then \n\
    echo "\nPreparing node_modules ..." \n\
    rm -Rf /home/node/app/node_modules; \n\
    mv /home/node/deps/node_modules /home/node/app/node_modules \n\
    mv /home/node/deps/package-lock.json /home/node/app/package-lock.json \n\
fi \n\
npm completion >> $HOME/.bashrc \n\
source $HOME/.bashrc \n\
echo "Ready to start" \n\
exec "$@" \n' > /entrypoint.sh
RUN ["chmod", "+x", "/entrypoint.sh"]
ENTRYPOINT ["/entrypoint.sh"]

USER node

ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN
ENV NODE_ENV development
ENV PATH /home/node/app/node_modules/.bin:$PATH

RUN mkdir -p /home/node/deps /home/node/app

WORKDIR /home/node/deps
COPY [".npmrc", "package.json", "package-lock.json*", "./"]
RUN npm install --quiet

WORKDIR /home/node/app
COPY --chown=node:node . .

CMD [ "bash" ]
