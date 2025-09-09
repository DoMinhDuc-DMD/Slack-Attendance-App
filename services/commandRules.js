const COMMAND_RULES = {
    '/chonquantri': {
        location: 'dm',
        roles: ['super_admin']
    },
    '/thongkenghi': {
        location: 'dm',
        roles: ['super_admin', 'admin']
    },
    '/xuatdulieu': {
        location: 'dm',
        roles: ['super_admin', 'admin']
    },
    '/xinnghi': {
        location: 'channel',
        roles: ['super_admin', 'admin', 'user']
    },
    '/capnhatnghi': {
        location: 'channel',
        roles: ['super_admin', 'admin', 'user']
    }
}

module.exports = { COMMAND_RULES };