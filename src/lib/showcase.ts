// The only galleries the public site may list or promote: public ones the studio has
// actually delivered. A draft/ready gallery is unfinished and an archived one has lost
// its web renditions, so neither belongs on the portfolio or in "new work" emails.
export const SHOWCASED_GALLERY = { visibility: "public", status: "delivered" } as const;
