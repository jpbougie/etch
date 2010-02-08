module Etch
  module Helpers
    def login(user)
      session['user'] = user.id
    end
    
    def logout
      session['user'] = nil
    end
    
    def load_session
      if u = session['user']
        @user = User.find(u)
      end
    end
    
    def logged_in?
      !!@user
    end
    
    def distance_of_time(from, to=nil)
      to ||= Time.now
      delta = to.to_i - from.to_i
      
      case delta
        when 0..60    then "less than a minute"
        when 60..119  then "a minute"
        when 61..3599 then "#{delta / 1.minute} minutes"
        else case (delta / 1.hour)
          when 1 then "an hour"
          when 2..23 then "#{delta / 1.hour} hours"
          else case (delta / 1.day)
            when 1 then "a day"
            when 2..7 then "#{delta / 1.day} days"
            else case (delta / 7.days)
              when 1 then "a week"
              when 2..4 then "#{delta / 7.days} weeks"
              else case (delta / 1.month)
                when 1 then "a month"
                else "#{delta / 1.month} months"
              end
            end
          end
        end
      end
    end
  end
end