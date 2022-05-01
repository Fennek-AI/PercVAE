const getDateString = (timestamp) => {
    const tmp = new Date(parseInt(timestamp));
    return tmp.getDate() + "." + (tmp.getMonth() + 1) + "." + tmp.getFullYear() + " "
            + tmp.getHours() + ":" + tmp.getMinutes();
}

export default {};
export {getDateString};
