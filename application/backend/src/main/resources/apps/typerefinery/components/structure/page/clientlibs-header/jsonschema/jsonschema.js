window.JSONSchemas = {};

(function ($, ns) {
  ns.REG_NUMBER = /[\d,\\.]+/g
  ns.jsonschemas = {}
  ns.SchemaValue = function () {
    return {}
  }

  ns.check_string = function (meta, error, value, errplus) {
    var type = typeof val
    if (type !== "string") value = value ? value + "" : null

    if (errplus == null) errplus = ""

    if (value) {
      switch (meta.subtype) {
        case "name":
          value = value.toName()
          break
      }
    }

    if (meta.$$REQUIRED && !value) {
      error.push(errplus + meta.$$ID + ".required")
      return
    }

    if (value == null) return

    var len = value.length

    if (meta.maxLength && len > meta.maxLength) {
      error.push(errplus + meta.$$ID + ".maxlength")
      return
    }

    if (meta.minLength && len < meta.minLength) {
      error.push(errplus + meta.$$ID + ".minlength")
      return
    }

    if (value) {
      switch (meta.subtype) {
        case "email":
          value = value.replace(/\s/g, "").toLowerCase()
          if (!value.isEmail()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "phone":
          value = value.replace(/\s/g, "").toLowerCase()
          if (!value.isPhone()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "url":
          if (!value.isURL()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "zip":
          if (!value.isZIP()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "guid":
          if (!value.isGUID()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "uid":
          if (!value.isUID()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "json":
          if (!value.isJSON()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "base64":
          if (!value.isBase64()) {
            error.push(errplus + meta.$$ID + ".invalid")
            return
          }
          break
        case "lowercase":
          value = value.toLowerCase()
          break
        case "uppercase":
          value = value.toUpperCase()
          break
        case "capitalize":
          value = value.capitalize()
          break
      }
    }

    if (meta.enum instanceof Array) {
      if (meta.enum.indexOf(value) === -1) {
        error.push(errplus + meta.$$ID + ".enum")
        return
      }
    }

    return value
  }

  ns.check_number = function (meta, error, value, errplus) {
    var type = typeof value

    if (errplus == null) errplus = ""

    if (type === "string") {
      if (ns.REG_NUMBER.test(value)) value = value.parseFloat()
      else value = null
    } else if (type !== "number") value = null

    if (meta.$$REQUIRED) {
      if (value == null) {
        error.push(errplus + meta.$$ID + ".required")
        return
      }
    }

    if (value == null) return

    if (meta.multipleOf) {
      if (value % meta.multipleOf !== 0) {
        error.push(errplus + meta.$$ID + ".multipleof")
        return
      }
    }

    if (meta.maximum) {
      if (value > meta.maximum) {
        error.push(errplus + meta.$$ID + ".maximum")
        return
      }
    }

    if (meta.exclusiveMaximum) {
      if (value >= meta.exclusiveMaximum) {
        error.push(errplus + meta.$$ID + ".exclusivemaximum")
        return
      }
    }

    if (meta.minimum) {
      if (value < meta.minimum) {
        error.push(errplus + meta.$$ID + ".minimum")
        return
      }
    }

    switch (meta.subtype) {
      case "smallint":
        if (value < -32767 || value > 32767) {
          error.push(errplus + meta.$$ID + ".invalid")
          return
        }
        break
      case "tinyint":
        if (value < 0 || value > 255) {
          error.push(errplus + meta.$$ID + ".invalid")
          return
        }
        break
    }

    if (meta.exclusiveMinimum) {
      if (value <= meta.exclusiveMinimum) {
        error.push(errplus + meta.$$ID + ".exclusiveminimum")
        return
      }
    }

    return value
  }

  ns.check_boolean = function (meta, error, value, errplus) {
    var type = typeof value
    if (type !== "boolean") value = value ? (value + "").parseBoolean() : null

    if (meta.$$REQUIRED) {
      if (errplus == null) errplus = ""

      if (value == null) {
        error.push(errplus + meta.$$ID + ".required")
        return
      }
    }

    if (value != null) return value
  }

  ns.check_date = function (meta, error, value, errplus) {
    if (!(value instanceof Date))
      value = value ? (value + "").parseDate() : null

    if (value && value instanceof Date && !(value.getTime() > 0)) value = null

    if (meta.$$REQUIRED) {
      if (errplus == null) errplus = ""

      if (value == null) {
        error.push(meta.$$ID + ".required")
        return
      }
    }

    if (value != null) return value
  }

  ns.read_def = function (ref, definitions) {
    if (ref[0] === "#") {
      var tmp = ref.substring(2).split("/")
      var def = definitions[tmp[0]]
      if (def) {
        var schema = tmp[1]
        var obj = def[schema]
        if (obj) {
          if (!obj.$$ID) obj.$$ID = schema
          return obj
        }
      }
    }
  }

  ns.check_array = function (meta, error, value, stop, definitions) {
    if (!(value instanceof Array)) {
      if (meta.$$REQUIRED) error.push(meta.$$ID + ".required")
      return
    }

    if (!value.length) {
      if (meta.$$REQUIRED) {
        error.push(meta.$$ID + ".required")
        return
      }
      return value
    }

    var response
    var tmp

    if (meta.items instanceof Array) {
      for (var i = 0; i < value.length; i++) {
        var val = value[i]
        var type = meta.items[i]

        if (type) {
          switch (type) {
            case "$ref":
              break
            case "number":
            case "integer":
            case "float":
            case "decimal":
              tmp = ns.check_number(type, error, val)
              if (tmp != null) {
                response.push(tmp)
                break
              } else {
                error.push(meta.$$ID + ".type")
                return
              }
            case "boolean":
            case "bool":
              tmp = ns.check_boolean(type, error, val)
              if (tmp != null) {
                response.push(tmp)
                break
              } else {
                error.push(meta.$$ID + ".type")
                return
              }
            case "date":
              tmp = ns.check_date(type, error, val)
              if (tmp != null) {
                response.push(tmp)
                break
              } else {
                error.push(meta.$$ID + ".type")
                return
              }
            case "object":
              tmp = ns.check_object(type, error, val, null, stop, definitions)
              if (tmp != null) {
                response.push(tmp)
                break
              } else {
                error.push(meta.$$ID + ".type")
                return
              }
            case "array":
              tmp = ns.check_array(type, error, value, null, definitions)
              if (
                tmp != null &&
                (!meta.uniqueItems || response.indexOf(tmp) === -1)
              ) {
                response.push(tmp)
                break
              } else {
                error.push(meta.$$ID + ".type")
                return
              }
            case "string":
            default:
              tmp = ns.check_string(type, error, val)
              if (tmp != null) {
                response.push(tmp)
                break
              } else {
                error.push(meta.$$ID + ".type")
                return
              }
          }
        } else if (!type && !meta.additionalItems) {
          error.push(meta.$$ID + ".additionalitems")
          return
        }
      }
    } else if (meta.items) {
      response = []

      for (let i = 0; i < value.length; i++) {
        let val = value[i]

        if (meta.items.$ref) {
          var ref = ns.read_def(meta.items.$ref, definitions)
          if (ref) {
            var newerror = []
            tmp = ns.transform(ref, newerror, val)
            if (newerror.length) {
              for (var err of newerror)
                error.push(ref.$$ID + "." + err, "@", null, i)
            } else if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            continue
          } else continue
        }

        switch (meta.items.type) {
          case "number":
          case "integer":
            tmp = ns.check_number(meta.items, error, val)
            if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            break
          case "boolean":
          case "bool":
            tmp = ns.check_boolean(meta.items, error, val)
            if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            break
          case "date":
            tmp = ns.check_date(meta.items, error, val)
            if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            break
          case "object":
            var newerrorObject = []
            tmp = ns.check_object(
              meta.items,
              newerrorObject,
              val,
              stop,
              definitions
            )
            if (newerrorObject.length) {
              for (let err of newerrorObject)
                error.push(meta.$$ID + "." + err.name, err.error, null, i)
            } else if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            break
          case "array":
            tmp = ns.check_array(meta.items, error, value, stop, definitions)
            if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            break
          case "string":
          default:
            tmp = ns.check_string(meta.items, error, val)
            if (
              tmp != null &&
              (!meta.uniqueItems || response.indexOf(tmp) === -1)
            )
              response.push(tmp)
            break
        }
      }
    } else response = meta.uniqueItems ? [...new Set(value)] : value

    if (!response.length && meta.$$REQUIRED) {
      error.push(meta.$$ID + ".required")
      return
    }

    if (meta.minItems && response.length < meta.minItems) {
      error.push(meta.$$ID + ".minitems")
      return
    }

    if (meta.maxItems && response.length < meta.maxItems) {
      error.push(meta.$$ID + ".maxitems")
      return
    }

    return response
  }

  ns.check_object = function (meta, error, value, response, stop, definitions) {
    if (!value || typeof value !== "object") {
      if (meta.$$REQUIRED) error.push(meta.$$ID + ".required")
      return
    }

    if (stop && error.items.length) return

    if (!response) response = new ns.SchemaValue()

    var count = 0
    var tmp

    for (var key in meta.properties) {
      var prop = meta.properties[key]

      if (!prop.ID) {
        prop.$$ID = key
        prop.$$REQUIRED = meta.required
          ? meta.required.indexOf(key) !== -1
          : false
      }

      if (stop && error.items.length) return

      if (meta.maxProperties && count > meta.maxProperties) {
        error.push(meta.$$ID + ".maxproperties")
        return
      }

      var val = value[key]

      switch (prop.type) {
        case "number":
        case "integer":
          tmp = ns.check_number(prop, error, val)
          if (tmp != null) {
            response[key] = tmp
            count++
          }
          break
        case "boolean":
        case "bool":
          tmp = ns.check_boolean(prop, error, val)
          if (tmp != null) {
            response[key] = tmp
            count++
          }
          break
        case "date":
          tmp = ns.check_date(prop, error, val)
          if (tmp != null) {
            response[key] = tmp
            count++
          }
          break
        case "string":
          tmp = ns.check_string(prop, error, val)
          if (tmp != null) {
            response[key] = tmp
            count++
          }
          break
        case "object":
          if (prop.properties) {
            tmp = ns.check_object(prop, error, val, null, null, definitions)
            if (tmp != null) {
              response[key] = tmp
              count++
            }
          } else {
            // check ref
            if (prop.$ref) {
              var ref = ns.read_def(prop.$ref, definitions)
              if (ref) {
                let newerror = []
                tmp = ns.transform(ref, newerror, val)
                if (newerror.items.length) {
                  for (var err of newerror.items)
                    error.push(ref.$$ID + "." + err, "@")
                } else response[key] = tmp
                continue
              } else continue
            }

            response[key] = val
            count++
          }
          break
        case "array":
          tmp = ns.check_array(prop, error, val, null, definitions)
          if (tmp != null) {
            response[key] = tmp
            count++
          }
          break
        default:
          if (prop.$ref) {
            let ref = ns.jsonschemas[prop.$ref]
            if (ref) {
              tmp = ns.check_object(ref, error, val, null, null, definitions)
              if (tmp != null) {
                response[key] = tmp
                count++
              } else if (prop.$$REQUIRED) error.push(prop.ID + ".required")
            } else error.push(prop.ID + ".reference")
          } else {
            // String
            tmp = ns.check_string(prop, error, val)
            if (tmp != null) {
              response[key] = tmp
              count++
            }
          }
          break
      }
    }

    if (meta.minProperties && count < meta.minProperties) {
      error.push(meta.$$ID + ".minproperties")
      return
    }

    if (count) return response
  }

  ns.transform = function (meta, error, value, stop) {
    var output

    switch (meta.type) {
      case "string":
        output = ns.check_string(meta, error, value)
        break
      case "number":
      case "integer":
      case "float":
      case "decimal":
        output = ns.check_number(meta, error, value)
        break
      case "boolean":
      case "bool":
        output = ns.check_boolean(meta, error, value)
        break
      case "date":
        output = ns.check_date(meta, error, value)
        break
      case "object":
        output = ns.check_object(meta, error, value, null, stop, meta)
        break
      case "array":
        output = ns.check_array(meta, error, value, stop, meta)
        break
      default:
        error.push(".type")
        return
    }

    if (stop && error.length) return

    return output || {}
  }

  ns.register = function (schema) {
    if (schema.$id) ns.jsonschemas[schema.$id] = schema
  }

})(jQuery, window.JSONSchemas);

