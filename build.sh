#!/bin/sh
# Builds index.html (the stand-alone / home-screen app) from app.html
cd "$(dirname "$0")"
{
echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
echo '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
echo '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
echo '<meta name="apple-mobile-web-app-title" content="NephroRx"><meta name="apple-mobile-web-app-status-bar-style" content="default">'
echo '<meta name="theme-color" content="#8c2f47"><link rel="apple-touch-icon" href="icon-180.png"><link rel="manifest" href="manifest.webmanifest">'
sed -n '1,/<\/style>/p' app.html
echo '</head><body>'
sed -n '/<\/style>/,$p' app.html | tail -n +2
echo '</body></html>'
} > index.html
