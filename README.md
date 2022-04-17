# Yazd University Video Downloader

This program has been created to help students download
the videos of their virtual courses during the spring semester of 1401.

The rest of the document is for developers and testers who want to run
the source code of the project instead of running the pre-built app.

## Requirements

- Node.js runtime environment 14 or above
- Git (for cloning)

## Installation

- Clone the project:

`git clone https://github.com/codenegaar/yazd-uni-video-downloader`

- Install the dependencies:

`npm i`

- Run:

`node src/app.js`

## Configuration

Some functionality of the project is configurable. Make a copy of
`.env.sample` and rename it to `.env` and start configuring. To use the default
value of a variable, just un-assign it (e.g. `LOGIN_PAGE_URL=`).

## Reporting bugs, suggestions and improvements

To report anything, you can create a new issue. Due to the small size and
the low scale of this project, there's no template or restriction for issues.

To help developing the project, please make PRs to merge your changes into the *develop* branch.
