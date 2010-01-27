require 'views/layout'

module Views
  class View < Layout
    def etchings
      @image.etchings.collect {|etching| {:id => etching.id, :created_at => etching.created_at }}
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
  end
end