require 'views/layout'

module Views
  class Draw < Layout
    def etchings
      @image.etchings.collect {|etching| {:id => etching.id} }
    end
    
    def any_etchings?
      !@image.etchings.empty?
    end
    
    def no_etchings
      not any_etchings?
    end
    
    def image_url
      @image.url
    end
    
    def image_id
      @image.id
    end
    
    def original_name
      @image.original_name
    end
  end
end