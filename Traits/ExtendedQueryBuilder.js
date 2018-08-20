const debug = require('debug')('mquery')
class ExtendedQueryBuilder {
    register (Model, options) {
        this.infoByName = Model.infoByName
        const extendFunctions = ["getAggregation", "setAggregations", "setAggregation","$match","$unwind","$lookup",
                                "_with","with","withLeft",
                                "where","orderBy","buildObjectSelect","select","limit","skip",
                                "fetchAggregate","countAggregate","aggregate", "paginateAggregation"
                            ]
        let _this = this;
        for(let fn of extendFunctions){
            Model.queryMacro(fn, function(...args){
                let fnc = _this[fn].bind(this)
                return fnc(...args)
            })
        }

    }

    getAggregation(){
        return this.aggregation || []
    }

    setAggregations (aggregations) {
        aggregations.forEach((aggregation) => {
            this.setAggregation(aggregation)
        })

        return this
    }

    setAggregation(object){
        if(! this.aggregation) this.aggregation = [];
        this.aggregation.push(object)
        return this
    }

    $match(params){
        return this.setAggregation({
            "$match": params
        })
    }

    $unwind(params){
        return this.setAggregation({
            "$unwind": params
        })
    }

    $lookup(name, params, type){
        let model = null
        try{
            model = use(params[0])
        }
        catch(e){
            console.error(e.message)
        }

        //sửa lỗi cho lucid-mongo bị ngược key cho 2 kiểu quan hệ "embedsMany", "referMany"
        let localField      = params[1]
        let foreignField    = params[2]
        if(["embedsMany", "referMany"].includes(type)){
            localField      = params[2]
            foreignField    = params[1]
        }
        this.setAggregation({
            "$lookup": {
                from: model.collection,
                localField: localField,
                foreignField: foreignField,
                as: name
            }
        })
    }

    _with (params,preserveNullAndEmptyArrays = false){
        if(Array.isArray(params[0])){
            params[0].forEach((functionName, index) =>{
                let info = this.Model.infoByName[functionName]
                if(!info){
                    console.error(functionName + ": not found in relationships")
                }
                else{
                    this.$lookup(functionName, info.params, info.relatedType)
                    if(this.Model.autoUnwind.includes(info.relatedType)){
                        this.$unwind({
                            path: `$${functionName}`,
                            preserveNullAndEmptyArrays: preserveNullAndEmptyArrays
                        })
                    }
                }

            })
        }
        this.withOriginal(...params);
        return this;
    }
    with (...fnList){
        return this._with(fnList)
    }
    withLeft(...fnList){
        return this._with(fnList, true)
    }


    where(...params){
        if(params.length == 1){
            this.setAggregation({
                "$match": params[0]
            })
        }
        this.whereOriginal(...params)
        return this
    }

    orderBy(...params){
        if(params.length == 1 && Object.keys(params[0]).length > 0){
            this.setAggregation({
                "$sort": params[0]
            })
        }

        this.orderByOriginal(...params)
        return this
    }

    buildObjectSelect(fields){
        let result = {}
        if(Array.isArray(fields)){
            for(let field of fields){
                result = {
                    ...result,
                    ...this.buildObjectSelect(field)
                }
            }
        }
        else if(typeof fields == "object"){
            for(let key in fields){
                result[key] = this.buildObjectSelect(fields[key])
            }
        }
        else{
            result[fields] = 1
        }
        return result
    }

    select(...params){
        if(params.length == 1){
            let project = this.buildObjectSelect(params[0])
            this.setAggregation({
                "$project": project
            })
        }

        this.selectOriginal(...params)
        return this
    }

    skip(...params){
        if(params.length == 1){
            this.setAggregation({
                "$skip": params[0]
            })
        }

        this.query.skip(...params)
        return this
    }

    limit(...params){
        if(params.length == 1){
            this.setAggregation({
                "$limit": params[0]
            })
        }

        this.query.limit(...params)
        return this
    }

    fetchAggregate(){
        return this.aggregate()
    }

    async countAggregate(){
        let result = await this.aggregate([{
            $count : "count"
        }])
        return result[0] ? result[0].count : 0
    }

    async aggregate(params = []){
        params = [
            ...this.getAggregation(),
            ...params,
        ]
        //debug("aggregate", params)
        return await this.aggregateOriginal(params)
    }



    async paginateAggregation (page, limit = 30) {
        let docs = []
        let total = await this.countAggregate()
        limit = parseInt(limit)
        if (limit !== -1) {
            let skip = (parseInt(page) - 1) * limit
            docs = await this.skip(skip).limit(limit).fetchAggregate()
        } else {
            docs = await this.fetchAggregate()
        }
        let lastPage = limit !== -1 ? (total % limit === 0) ? parseInt(total / limit) : (parseInt(total / limit) + 1) : 1
        let paginateData = {
            total   : total || 0,
            perPage : limit !== -1 ? limit : total,
            lastPage: lastPage,
            page    : page,
            data    : docs || []
        }

        return paginateData
    }

  }

  module.exports = ExtendedQueryBuilder
