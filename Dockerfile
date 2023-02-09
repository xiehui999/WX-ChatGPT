FROM node:18-slim

WORKDIR /code

ADD package.json package-lock.json /code/

RUN  npm install

# Suppress an apt-key warning about standard out not being a terminal. Use in this script is safe.
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.

ADD . /code

#RUN npm run dev
#CMD ["node", "lib/bundle.esm.js"]
CMD xvfb-run --server-args="-screen 0 1280x800x24 -ac -nolisten tcp -dpi 96 +extension RANDR" npm run dev
