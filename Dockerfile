FROM node:16

ARG VERSION
ARG BUILD
ARG BRANCH

ENV VERSION=${VERSION} \
    BRANCH=${BRANCH} \
    BUILD=${BUILD}

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 9900

CMD [ "yarn", "run", "web" ]
