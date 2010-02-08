Etch = {}

Etch.save = function(canvas, imageId) {
  json = JSON.stringify({ data: canvas.canvas.toDataURL('image/png'), objects: _.map(canvas.objects, function(obj) { return obj.toJson() })})
  $.post('/draw/' + imageId, json, function() {
    location.href = '/images/' + imageId
  })
}

Etch.load = function(canvas, imageId, etchId) {
  $.getJSON('/etch/' + imageId + '/' + etchId, function(data) {
    canvas.reset()
    canvas.objects = _.map(data, function(element) {
      type = element["type"][0].toUpperCase() + element["type"].substring(1, element["type"].length)
      return Etch.Objects[type].fromJson(element)
    })
    
    _.each(canvas.objects, function(object) { object.draw(canvas.getContext()) })
  })
}

Etch.Canvas = {
  objects: [],
  canvas: null,
  buffer: null,
  id: null,
  activeTool: null,
  listeners: [],
  width: 0,
  height: 0,
  undoStack: [],
  parameters: {},
  initialize: function(id, image, settings) {
    this.id = id
    this.canvas = $(id).get()[0]
    this.listeners = []
    this.undoStack = []
    this.objects = []
    this.parameters = {}
    
    if(typeof image == 'string') {
      this.image = new Image()
      this.image.src = image
    } else {
      this.image = image
    }
    
    var self = this
    this.image.addEventListener('load', function() {
      self.width = self.image.width //parseInt($(id).attr('width'))
      self.height = self.image.height //parseInt($(id).attr('height'))
      $(self.canvas).attr('width', self.width).attr('height', self.height)

      self.getContext().drawImage(this, 0, 0, this.width, this.height, 0, 0, self.width, self.height)
              
      if(!settings.readonly) {
        self.buffer = $('<canvas id="' + $(self.canvas).attr('id') + '-buffer"></canvas>')
                        .attr('width', self.width)
                        .attr('height', self.height)
        $(self.canvas).after(self.buffer)
        
      
        self.buffer = self.buffer.get()[0]
        self.setupEvents()
      }
    })
  },
  
  reset: function(alsoObjects) {
    this.getContext().clearRect(0, 0, this.width, this.height)
    this.getContext().drawImage(this.image, 0, 0, this.width, this.height, 0, 0, this.width, this.height)
    if(alsoObjects) {
      this.objects = []
      this.undoStack = []  
    }
  },
  
  undo: function() {
    obj = this.objects.pop()
    this.undoStack.push(obj)
    
    this.reset()
    ctx = this.getContext()
    _.each(this.objects, function(object) { object.draw(ctx) })
  },
  
  setupEvents: function() {
    this.buffer.addEventListener('mousedown', this.makeHandler('mousedown'), false)
    this.buffer.addEventListener('mousemove', this.makeHandler('mousemove'), false)
    this.buffer.addEventListener('mouseup', this.makeHandler('mouseup'), false)
    this.buffer.addEventListener('click', this.makeHandler('click'), false)
    canvas = this
  },
  
  addObject: function(object) {
    this.objects.push(object)
    this.undoStack = []
  },
  
  getBufferContext: function() {
    return this.buffer.getContext("2d")
  },
  
  getContext: function() {
    return this.canvas.getContext("2d")
  },
  
  sendEvent: function(type, event) {
    fired = false
    canvas = this
    _.each(_.filter(this.listeners, function(elem) { return elem[0] == type }), function(listener) {
      if(!fired) {
        canvas.getBufferContext().clearRect(0, 0, canvas.width, canvas.height)
      }
      listener[1].onEvent(type, event)
      fired = true
    })
    
    return fired
  },
  
  makeHandler: function(type) {
    var canvas = this
    return function(event) {
      canvas.sendEvent(type, event)
      if(event.preventDefault)
        event.preventDefault()
      else event.returnValue = false
      event.stopPropagation()
      return false
    }
  },
  
  follow: function(type, object) {
    this.listeners.push([type, object])
  },
  
  deactivateCurrentTool: function() {
    this.activeTool = null
    this.listeners = []
    this.parameters = {}
    $('#params').empty()
  },
  
  activateTool: function(tool) {
    this.deactivateCurrentTool()
    
    this.activeTool = tool
    if(typeof this.activeTool.setup != 'undefined') this.activeTool.setup(this)
    this.activeTool.activateStrategies(this)
    
  },
  
  addParameter: function(name, type, settings) {
    settings = _.extend({label: name}, settings)
    this.parameters[name] = _.clone(type)
    
    element = this.parameters[name].setup(name, settings['default'])
        
    $('#params').append(element)
    $('#params').show()
  },
  
  getParameter: function(name) {
    return this.parameters[name].getValue()
  }
}

Etch.Tool = {
  selectStrategy: null,
  insertStrategy: null,
  editStrategy: null,
  
  draw: function(context) {
    
  },
  
  activateStrategies: function(canvas) {
    if(this.selectStrategy) this.selectStrategy.activate(this, canvas)
    if(this.insertStrategy) this.insertStrategy.activate(this, canvas)
    if(this.editStrategy) this.editStrategy.activate(this, canvas)
  },
}

Etch.Tools = {}

Etch.Object = {
  getBoundingBox: function() {
    return [0, 0, 0, 0]
  },
  
  draw: function(context) {
    
  },
  
  intersects: function(x, y) {
    return false
  },
  
  toJson: function() {
    return {}
  },
}

Etch.Objects = {}

Etch.Objects.Rect = _.clone(Etch.Object)
_.extend(Etch.Objects.Rect, {
    x: 0, y: 0, w: 0, h: 0,
    stroke: "#000000",
    getBoundingBox: function() {
      return [x, y, w, h]
    },
    
    intersects: function(x, y) {
      return x >= this.x && x <= (this.x + this.w) &&
             y >= this.x && y <= (this.y + this.h)
    },
    
    draw: function(context) {
      context.save()
      context.lineWidth = 10
      context.strokeStyle = this.stroke
      context.strokeRect(this.x, this.y, this.w, this.h)
      context.restore()
    },
    
    toJson: function() {
      return { x: this.x, y: this.y, width: this.w, height: this.h, stroke: this.stroke, type: "rect"}
    },
    
    fromJson: function(data) {
      instance = _.clone(this)
      instance.x = data.x
      instance.y = data.y
      instance.w = data.width
      instance.h = data.height
      instance.stroke = data.stroke
      
      return instance
    },
})

Etch.Objects.Ellipse = _.clone(Etch.Object)
_.extend(Etch.Objects.Ellipse, {
  x: 0, y: 0, w: 0, h: 0,
  stroke: "#000000",
  getBoundingBox: function() {
    return [x, y, w, h]
  },
  
  intersects: function(x, y) {
    return x >= this.x && x <= (this.x + this.w) &&
           y >= this.x && y <= (this.y + this.h)
  },
  
  draw: function(context) {
    var x = this.x + this.w,
        y = this.y;
    var w = this.w / 2,
        h = this.h / 2,
        C = 0.5522847498307933;
    x = x - w
    y = y + h
    var c_x = C * w,
        c_y = C * h;
    
    context.save()
    context.beginPath()
    
    context.lineWidth = 10
    context.strokeStyle = this.stroke
    
    // from Processing.js
    context.moveTo( x + w, y );
    context.bezierCurveTo( x+w    ,   y-c_y  ,   x+c_x  ,   y-h   ,   x    ,   y-h  );
    context.bezierCurveTo( x-c_x  ,   y-h    ,   x-w    ,   y-c_y ,   x-w  ,   y    );
    context.bezierCurveTo( x-w    ,   y+c_y  ,   x-c_x  ,   y+h, x,   y+h           );
    context.bezierCurveTo( x+c_x  ,   y+h    ,   x+w    ,   y+c_y ,   x+w  ,   y    );
    context.stroke()
    
    context.restore()
  },
  
  toJson: function() {
    return { x: this.x, y: this.y, width: this.w, height: this.h, stroke: this.stroke, type: "ellipse"}
  },
  
  fromJson: function(data) {
    instance = _.clone(this)
    instance.x = data.x
    instance.y = data.y
    instance.w = data.width
    instance.h = data.height
    instance.stroke = data.stroke
    
    return instance
  },
})

Etch.Objects.Line = _.clone(Etch.Object)
_.extend(Etch.Objects.Line, {
  x1: 0, y1: 0, x2: 0, y2: 0,
  stroke: "#000000",
  draw: function(context) {
    context.save()
    context.beginPath()
    context.lineWidth = 10
    context.strokeStyle = this.stroke
    
    context.moveTo(this.x1, this.y1)
    context.lineTo(this.x2, this.y2)
    
    context.stroke()
    context.restore()
  },
  
  toJson: function() {
    return {x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2, stroke: this.stroke, type: "line"}
  },
  
  fromJson: function(data) {
    instance = _.clone(this)
    instance.x1 = data.x1
    instance.y1 = data.y1
    instance.x2 = data.x2
    instance.y2 = data.y2
    instance.stroke = data.stroke
    
    return instance
  },
})

Etch.Objects.Arrow = _.clone(Etch.Object)
_.extend(Etch.Objects.Arrow, {
  x1: 0, y1: 0, x2: 0, y2: 0,
  
  draw: function(context) {
    deltaX = this.x2 - this.x1
    deltaY = this.y2 - this.y1

    context.save()
    context.translate(this.x1 - 5, this.y1)
    context.rotate(Math.atan2(deltaY, deltaX))
    distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    context.scale(distance / 55.0, distance / 55.0 )
    
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(40, 0)
    context.lineTo(35, -10)
    context.lineTo(45, -10)
    context.lineTo(55, 5)
    context.lineTo(45, 20)
    context.lineTo(35, 20)
    context.lineTo(40, 10)
    context.lineTo(0, 10)
    context.lineTo(0, 00)
    
    context.fill()
    
    context.restore()
  },
  
  toJson: function() {
    return {x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2, type: "arrow"}
  },
  
  fromJson: function(data) {
    instance = _.clone(this)
    instance.x1 = data.x1
    instance.y1 = data.y1
    instance.x2 = data.x2
    instance.y2 = data.y2
    
    return instance
  },
})

Etch.Objects.Text = _.clone(Etch.Object)
_.extend(Etch.Objects.Text, {
  x: 0, y:0, text: "",
  
  draw: function(context) {
    context.save()
    context.font = "20px bold"
    context.fillText(this.text, this.x, this.y)
    
    context.restore()
  },
  
  toJson: function() {
    return {text: this.text, x: this.x, y: this.y, type: "text"}
  },
  
  fromJson: function(data) {
    instance = _.clone(this)
    instance.x = data.x
    instance.y = data.y
    instance.text = data.text
    
    return instance
  },
})



Etch.Strategies = {}

Etch.Strategies.DefaultSelect = {
  activate: function(tool, canvas) {
    // do nothing
    return true
  },
}

Etch.Strategies.DrawBox = {
  active: false,
  startingPosition: [0, 0],
  endingPosition: [0, 0],
  canvas: null,
  tool: null,
  activate: function(tool, canvas) {
    this.canvas = canvas
    this.tool = tool
    canvas.follow('mousedown', this)
    canvas.follow('mousemove', this)
    canvas.follow('mouseup', this)
  },
  
  onEvent: function(type, event) {
    switch(type) {
      case 'mousedown':
        this.active = true
        this.startingPosition = [event.offsetX, event.offsetY]
        break
      case 'mousemove':
        if(this.active) {
          this.endingPosition = [event.offsetX, event.offsetY]
          this.draw(this.canvas.getBufferContext())
        }
        break
      case 'mouseup':
        if(this.active) {
          this.endingPosition = [event.offsetX, event.offsetY]
          box = this.makeBox()
          object = this.tool.makeToFit(box[0], box[1], box[2], box[3])
          this.canvas.addObject(object)
          this.draw(this.canvas.getContext())
          this.active = false
        }
        break
      
    }
  },
  
  makeBox: function() {
    topleft = [Math.min(this.startingPosition[0], this.endingPosition[0]),
               Math.min(this.startingPosition[1], this.endingPosition[1])]
    bottomright = [Math.max(this.startingPosition[0], this.endingPosition[0]),
                  Math.max(this.startingPosition[1], this.endingPosition[1])]
    distance = [bottomright[0] - topleft[0], bottomright[1] - topleft[1]]
    
    return [topleft[0], topleft[1], distance[0], distance[1]]
  },
  
  draw: function(context) {
    
    box = this.makeBox()
    this.tool.makeToFit(box[0], box[1], box[2], box[3]).draw(context)
  },
}

Etch.Strategies.HeadTail = {
  active: false,
  startingPosition: [0, 0],
  endingPosition: [0, 0],
  canvas: null,
  tool: null,
  activate: function(tool, canvas) {
    this.canvas = canvas
    this.tool = tool
    canvas.follow('mousedown', this)
    canvas.follow('mousemove', this)
    canvas.follow('mouseup', this)
  },
  
  onEvent: function(type, event) {
    switch(type) {
      case 'mousedown':
        this.active = true
        this.startingPosition = [event.offsetX, event.offsetY]
        break
      case 'mousemove':
        if(this.active) {
          this.endingPosition = [event.offsetX, event.offsetY]
          this.draw(this.canvas.getBufferContext())
        }
        break
      case 'mouseup':
        if(this.active) {
          this.endingPosition = [event.offsetX, event.offsetY]
          object = this.tool.make(this.startingPosition[0], this.startingPosition[1],
                                  this.endingPosition[0], this.endingPosition[1])
          this.canvas.addObject(object)
          this.draw(this.canvas.getContext())
          this.active = false
        }
        break
    }
  },
  
  draw: function(context) {
    object = this.tool.make(this.startingPosition[0], this.startingPosition[1],
                            this.endingPosition[0], this.endingPosition[1])
    object.draw(context)
  },
}

Etch.Strategies.TextInsert = {
  active: false,
  startingPosition: [0, 0],
  canvas: null,
  tool: null,
  buffer: "",
  element: null,
  activate: function(tool, canvas) {
    this.canvas = canvas
    this.tool = tool
    this.buffer = ""
    canvas.follow('click', this)
    canvas.follow('keyup', this)
    //canvas.follow('keypress', this)
    
    this.element = $('#etch-text-input')
    if(this.element.length == 0) {
      this.element = $('<input type="text" id="etch-text-input">')
      $('body').append(this.element)
    }
    
  },
  
  onEvent: function(type, event) {
    switch(type) {
      case 'click':
        this.startingPosition = [event.offsetX, event.offsetY]
        this.buffer = ""
        this.element.val('').css('left', event.pageX).css('top', event.pageY).show().focus()
        
        self = this
        this.element.keypress(function(event) {
          if(event.which == 13) {
            self.buffer = self.element.val()
            object = self.tool.make(self.buffer, self.startingPosition[0], self.startingPosition[1])
            self.canvas.addObject(object)
            object.draw(self.canvas.getContext())
            self.element.hide()
          }
        })
        break
      }
  },
  
  draw: function(context) {
    object = this.tool.make(this.buffer, this.startingPosition[0], this.startingPosition[1])
    object.draw(context)
  },
}

Etch.Tools.Rect = _.clone(Etch.Tool)
_.extend(Etch.Tools.Rect, {
  selectStrategy: Etch.Strategies.DefaultSelect,
  insertStrategy: Etch.Strategies.DrawBox,
  
  setup: function(canvas) {
    this.canvas = canvas
    canvas.addParameter("strokeColor", Etch.Params.Color, {'default': '#000000'})
  },
  
  makeToFit: function(x, y, w, h) {
    object = _.clone(Etch.Objects.Rect)
    object.x = x
    object.y = y
    object.w = w
    object.h = h
    object.stroke = this.canvas.getParameter("strokeColor")
    return object
  }
})

Etch.Tools.Ellipse = _.clone(Etch.Tool)
_.extend(Etch.Tools.Ellipse, {
  selectStrategy: Etch.Strategies.DefaultSelect,
  insertStrategy: Etch.Strategies.DrawBox,
  
  setup: function(canvas) {
    this.canvas = canvas
    canvas.addParameter("strokeColor", Etch.Params.Color, {'default': '#000000'})
  },
  
  makeToFit: function(x, y, w, h) {
    object = _.clone(Etch.Objects.Ellipse)
    object.x = x
    object.y = y
    object.w = w
    object.h = h
    object.stroke = this.canvas.getParameter("strokeColor")
    return object
  }
})

Etch.Tools.Line = _.clone(Etch.Tool)
_.extend(Etch.Tools.Line, {
  selectStrategy: Etch.Strategies.DefaultSelect,
  insertStrategy: Etch.Strategies.HeadTail,

  setup: function(canvas) {
    this.canvas = canvas
    canvas.addParameter("strokeColor", Etch.Params.Color, {'default': '#000000'})
  },

  make: function(x1, y1, x2, y2) {
    object = _.clone(Etch.Objects.Line)
    _.extend(object, {
      x1: x1, y1: y1, x2: x2, y2: y2, stroke: this.canvas.getParameter("strokeColor")
    })
    
    return object
  }
})

Etch.Tools.Arrow = _.clone(Etch.Tool)
_.extend(Etch.Tools.Arrow, {
  selectStrategy: Etch.Strategies.DefaultSelect,
  insertStrategy: Etch.Strategies.HeadTail,
  
  make: function(x1, y1, x2, y2) {
    object = _.clone(Etch.Objects.Arrow)
    _.extend(object, {
      x1: x1, y1: y1, x2: x2, y2: y2
    })
    
    return object
  }
})

Etch.Tools.Text = _.clone(Etch.Tool)
_.extend(Etch.Tools.Text, {
  selectStrategy: Etch.Strategies.DefaultSelect,
  insertStrategy: Etch.Strategies.TextInsert,
  
  make: function(text, x, y) {
    object = _.clone(Etch.Objects.Text)
    _.extend(object, {
      text: text, x: x, y: y
    })
    
    return object
  }
})

Etch.Params = {}

Etch.Params.Color = {
  color: null,
  getValue: function() {
    return this.color
  },
  
  setValue: function(value) {
    this.color = value
  },
  
  setup: function(id, val) {
    element = $('<div class="color-picker" style="width: 20px; height: 20px">&nbsp;</div>').attr('id', id).css("backgroundColor", val)
    
    var self = this
    element.ColorPicker({ 'default': val,  
        onChange: function(hsb, hex, rgb) { 
          self.setValue(hex); element.css('backgroundColor', '#' + hex)},
        onBeforeShow: function () { $(this).ColorPickerSetColor(val) }})
    
    return element
  }
}