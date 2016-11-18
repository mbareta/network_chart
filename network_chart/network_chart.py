"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.fragment import Fragment


class NetworkChartXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.
    display_name = String(display_name="Display Name",
                          default="Network Chart",
                          scope=Scope.settings,
                          help="This name appears in the horizontal navigation at the top of the page.")

    json_url = String(help="URL of the JSON data", default=None, scope=Scope.content)

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the NetworkChartXBlock, shown to students
        when viewing courses.
        """
        html_str = pkg_resources.resource_string(__name__, "static/html/network_chart.html")
        frag = Fragment(unicode(html_str).format(
                                                json_url=self.json_url
                                                ))
        frag.add_css(self.resource_string("static/css/chart.css"))
        frag.add_css(self.resource_string("static/css/tooltip.css"))
        frag.add_javascript(self.resource_string("static/js/src/d3.v4.js"))
        # frag.add_javascript(self.resource_string("static/js/src/chart.js"))
        frag.add_javascript_url(self.runtime.local_resource_url(self, 'public/dist/bundle.js'))
        frag.initialize_js('initChart')
        return frag

    def studio_view(self, context):
        """
        Create a fragment used to display the edit view in the Studio.
        """
        html_str = pkg_resources.resource_string(__name__, "static/html/studio_view.html")
        frag = Fragment(unicode(html_str).format(
                                                    display_name=self.display_name,
                                                    json_url=self.json_url,
                                                    display_description=self.display_description,
                                                    thumbnail_url=self.thumbnail_url
                                                ))
        js_str = pkg_resources.resource_string(__name__, "static/js/src/studio_edit.js")
        frag.add_javascript(unicode(js_str))
        frag.initialize_js('StudioEdit')
        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        self.display_name = data.get('display_name')
        self.json_url = data.get('json_url')
        self.display_description = data.get('display_description')
        self.thumbnail_url = data.get('thumbnail_url')

        return {'result': 'success'}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("NetworkChartXBlock",
             """<network_chart/>
             """),
            ("Multiple NetworkChartXBlock",
             """<vertical_demo>
                <network_chart/>
                <network_chart/>
                <network_chart/>
                </vertical_demo>
             """),
        ]
