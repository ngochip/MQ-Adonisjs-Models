'use strict'

const Model = use('Model')
const Config = use('Config')
const moment = use('moment')
const {ObjectID} = use('mongodb')

class BaseModel extends Model {
    constructor(...params){
        super(...params)
        this.initRelationshipFunction() //khởi tạo các hàm relationship cho model
    }

    static get relationships() {
        return {
            belongsTo       : {},
            belongsToMany   : {},
            hasMany         : {},
            hasManyThrough  : {},
            hasOne          : {},
            morphMany       : {},
            morphTo         : {},
            morphOne        : {},
            embedsOne       : {},
            embedsMany      : {},
            referMany       : {},
        }
    }

    static get autoUnwind(){
        return [
            "belongsTo",
            "hasOne",
            "embedsOne",
            "morphOne"
        ]
    }

    static async schema(){
        if(this.$schema) return this.$schema
        await this.initSchema();
        return this.$schema
    }

    static boot () {
        super.boot()
        this.initRelationshipFunction()
        this.addTrait('ExtendedQueryBuilder')
        this.collation = Config.get('database.mongodb.collation') || {locale: 'vi'}
        this.initSchema()

    }
    static queryMacro (name, fn) {
        if (!this.QueryBuilder) {
          super.queryMacro()
        }

        if(this.QueryBuilder.prototype[name] && !this.QueryBuilder.prototype[name + "Original"]){
            this.QueryBuilder.prototype[name + "Original"] = this.QueryBuilder.prototype[name]
        }
        this.QueryBuilder.prototype[name] = fn
        return this
    }

    static query(...params){
        let query = super.query(...params)
        query.setOptions({ collation: this.collation })
        return query
    }

    /**
     * override lại hàm set của thư viện. Nếu value truyền vào là function thì set thẳng là method,
     * còn là biến dữ liệu thì set vào $attributes như như viện.
     */
    set (name, value) {
        if(typeof value == "function"){
            return this[name] = value
        }
        this.$attributes[name] = this._getSetterValue(name, value)
    }

    static async initSchema(){
        let data = await this.query().first()
        if(!data) return
        data = data.$originalAttributes
        this.$schema = {}
        for(let field in data){
            this.$schema[field] = typeof data[field]
            if(this.$schema[field] == "object"){
                if(moment.isMoment(data[field])){
                    this.$schema[field] = "moment"
                }
                else if(data[field] instanceof ObjectID){
                    this.$schema[field] = "objectid"
                }
                else if(data[field] instanceof Array){
                    this.$schema[field] = "array"
                }
            }
        }
    }

    /**
     * khởi tạo các hàm relationship mỗi khi khỏi tạo model
     */
    initRelationshipFunction(){
        let fnList = this.constructor.infoByName;
        let fnNames = Object.keys(fnList)

        fnNames.forEach((functionName) =>{
            let info = fnList[functionName]
            let params = info.params
            let relatedType = info.relatedType
            //function relationship theo default của addonjs
             this[functionName] = () => {
                return this[relatedType](...params)
            }
        })
    }


    static initRelationshipFunction(){
        this.infoByName     = {}
        let relates = Object.keys(this.relationships);
        //for tất cả các loại quan hệ
        relates.forEach((relateKey, index) =>{
            let relateObj = this.relationships[relateKey]

            let functions = Object.keys(relateObj) //lấy ra danh sách các functionName

            functions.forEach((functionName, i) => {
                let params = relateObj[functionName] //lấy ra các params của function
                this.infoByName[functionName] = {
                    params: params,
                    relatedType: relateKey
                }
            })
        })
    }



}

module.exports = BaseModel
