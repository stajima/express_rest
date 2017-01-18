const authenticationController = () => {
    let login = (req, res, next) => {
        console.log('logging in');
    }

    return {
        login: login
    }
}

module.exports = authenticationController;