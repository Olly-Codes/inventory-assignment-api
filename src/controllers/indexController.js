const getStatus = (req, res) => {
    res.status(200).json({ message: "API is up and running" });
}

export default {
    getStatus
}