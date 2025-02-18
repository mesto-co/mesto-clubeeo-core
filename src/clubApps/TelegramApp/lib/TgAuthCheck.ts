import * as crypto from "crypto"

export class TgAuthCheck {
    static dataCheckString(params: object): string {
        let orderedParams = {}
        Object.keys(params).sort().forEach(key => {
            if (key != "hash") {
                orderedParams[key] = params[key];
            }
        })
        return Object.keys(orderedParams).map(key => `${key}=${orderedParams[key]}`).join("\n")
    }

    static genHash(params: object, token: string): string {
        const secret = crypto.createHash('sha256').update(token).digest();
        const checkString = this.dataCheckString(params)

        return crypto
            .createHmac('sha256', secret)
            .update(checkString)
            .digest('hex');
    }

    static checkHash(params: object, token: string, hash: string): boolean {
        if (!hash || !params || !token) {
            return false
        }
        return this.genHash(params, token) === hash
    }

    static checkParams(params: object, token: string): boolean {
        return this.checkHash(params, token, params['hash'])
    }
}
