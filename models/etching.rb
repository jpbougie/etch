  class Etching
    include MongoMapper::EmbeddedDocument
    
    key :user_id, ObjectId
    key :created_at, Time
    key :data, String
    
    belongs_to :user
    many :elements
    
    def self.import(data)
      etching = Etching.new
      
      json = Yajl::Parser.parse(data)
      
      etching.data = json["data"]
      
      etching.elements = json["objects"].map do |elem|
        Element.types[elem["type"]].new elem
      end
      
      etching
    end
  end
  
  class Element
    include MongoMapper::EmbeddedDocument
    
    key :fill, String
    key :stroke, String
    
    def self.types
      @type ||= {}
    end
    
    def self.register(type, klass)
      @type ||= {}
      @type[type] = klass
    end
  end
  
  class Ellipse < Element
    key :x, Integer
    key :y, Integer
    key :width, Integer
    key :height, Integer
    
    Element.register('ellipse', self)
  end
  
  class Rectangle < Element
    key :x, Integer
    key :y, Integer
    key :width, Integer
    key :height, Integer
    
    Element.register('rect', self)
  end
  
  class Line < Element
    Element.register('line', self)
  end
  
  class Arrow < Element
    key :x1, Integer
    key :y1, Integer
    key :x2, Integer
    key :y2, Integer
    
    Element.register('arrow', self)
  end
  
  class Text < Element
    key :text, String
    key :x, Integer
    key :y, Integer
    
    Element.register('text', self)
  end