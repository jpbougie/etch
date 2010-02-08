require 'views/layout'

module Views
  class View < Layout
    
    include Etch::Helpers
    
    def etchings
      @image.etchings.collect {|etching| {:id => etching.id,
                                          :created_at => distance_of_time(etching.created_at), 
                                          :thumbnail => "/system/#{etching.id}_thumb.png"}}
    end
    
    def any_etchings?
      !@image.etchings.empty?
    end
    
    def no_etchings
      not any_etchings?
    end
    
    def image_url
      @image.id.to_s + '_medium.png'
    end
    
    def image_id
      @image.id
    end
  end
end