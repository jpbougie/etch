require 'base64'
require 'mini_magick'

class DecodeEtching
  @queue = :decode_etching
  def self.perform(image_id, etching_id, dir)
    image = Image.find(image_id)
    etching = image.etchings.find(etching_id)
    
    separator = etching.data.index(";")
    type = etching.data[0..(separator - 1)]
    encoding = etching.data.index(',')
    
    binary = Base64.decode64(etching.data[(encoding + 1)..-1])
    
    extension = type.split("/")[1]
    name = [etching.id.to_s, extension].join(".")
    
    File.open(File.join(dir, name), 'wb') do |f|
      f.write binary
    end
    
    file = MiniMagick::Image.from_file("#{dir}/#{name}")
    file.resize("80")
    file.write("#{dir}/#{etching.id}_thumb.#{extension}")
  end
end