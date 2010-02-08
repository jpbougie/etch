require 'views/layout'

module Views
  class Images < Layout
    def any_images?
      @images && !@images.empty?
    end
    
    def images
      @images.map {|img| {:id => img.id.to_s, :url => img.url, :name => img.original_name }}
    end
    
    def no_images
      not any_images?
    end
  end
end