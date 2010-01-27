require 'views/layout'

module Views
  class Images < Layout
    def any_images?
      @images && !@images.empty?
    end
    
    def images
      @images
    end
    
    def no_images
      not any_images?
    end
  end
end