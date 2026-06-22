const logger = { debug, info, fatal, error, warn };

function debug(message: unknown) {
    console.log(message);
}
function info(message: unknown) {
    console.info(message);
}
function warn(message: unknown) {
    console.warn(message);
}
function error(message: unknown) {
    console.error(message);
}
function fatal(message: unknown) {
    console.error(message);
}

export { logger };
